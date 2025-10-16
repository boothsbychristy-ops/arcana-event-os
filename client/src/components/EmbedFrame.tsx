export default function EmbedFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border h-[600px] bg-card">
      <div className="bg-muted px-4 py-2 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      </div>
      <iframe
        src={src}
        title={title}
        className="w-full h-[calc(100%-40px)] border-0"
        allow="fullscreen"
      />
    </div>
  );
}
