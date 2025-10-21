import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface OptimisticOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  queryKey: any[];
  optimisticUpdate?: (oldData: any, variables: TVariables) => any;
  undoable?: boolean;
  undoDelay?: number; // milliseconds before actually performing delete
  successMessage?: string;
  errorMessage?: string;
}

export function useOptimisticMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  queryKey,
  optimisticUpdate,
  undoable = false,
  undoDelay = 5000,
  successMessage,
  errorMessage = "Operation failed"
}: OptimisticOptions<TData, TVariables>) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pendingUndo, setPendingUndo] = useState<TVariables | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout>();
  
  const mutation = useMutation({
    mutationFn: async (variables: TVariables) => {
      // If undoable, delay the actual mutation
      if (undoable) {
        setPendingUndo(variables);
        
        return new Promise<TData>((resolve, reject) => {
          undoTimeoutRef.current = setTimeout(async () => {
            try {
              const result = await mutationFn(variables);
              setPendingUndo(null);
              resolve(result);
            } catch (error) {
              setPendingUndo(null);
              reject(error);
            }
          }, undoDelay);
        });
      }
      
      // Otherwise perform immediately
      return mutationFn(variables);
    },
    
    onMutate: async (variables) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey });
      
      // Get current data
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically update
      if (optimisticUpdate) {
        queryClient.setQueryData(queryKey, (old: any) => 
          optimisticUpdate(old, variables)
        );
      }
      
      return { previousData };
    },
    
    onError: (error, variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    },
    
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey });
      
      if (successMessage && !undoable) {
        toast({
          title: "Success",
          description: successMessage
        });
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });
  
  const undo = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      setPendingUndo(null);
      
      // Restore original data
      queryClient.invalidateQueries({ queryKey });
      
      toast({
        title: "Undone",
        description: "Action has been undone"
      });
    }
  };
  
  // Show undo toast when action is pending
  useEffect(() => {
    if (pendingUndo && undoable) {
      const { dismiss } = toast({
        title: successMessage || "Action performed",
        description: (
          <div className="flex items-center gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                undo();
                dismiss();
              }}
              className="gap-2"
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </Button>
            <span className="text-xs text-muted-foreground">
              {undoDelay / 1000}s to undo
            </span>
          </div>
        ),
        duration: undoDelay
      });
    }
  }, [pendingUndo]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    ...mutation,
    undo,
    isPending: mutation.isPending || pendingUndo !== null
  };
}

// Helper for soft delete operations
export function useSoftDelete<T extends { id: string }>(
  resource: string,
  queryKey: any[]
) {
  return useOptimisticMutation<void, string>({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/${resource}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!res.ok) throw new Error(`Failed to delete ${resource}`);
    },
    queryKey,
    optimisticUpdate: (oldData: T[], id: string) => {
      return oldData?.filter((item: T) => item.id !== id) || [];
    },
    undoable: true,
    undoDelay: 5000,
    successMessage: `${resource.charAt(0).toUpperCase() + resource.slice(1)} deleted`,
    errorMessage: `Failed to delete ${resource}`
  });
}