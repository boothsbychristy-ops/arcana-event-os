/**
 * Security Regression Test Suite
 * 
 * Run with: npm run test:security
 * 
 * This validates critical security controls:
 * 1. Authentication enforcement
 * 2. Ownership validation (tenant isolation)
 * 3. Schema validation (.strict() mode)
 */

import request from 'supertest';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      results.push({ name, passed: false, error: String(error) });
      console.log(`❌ ${name}: ${error}`);
    }
  };
}

async function runTests() {
  console.log('\n🔒 Security Regression Test Suite\n');

  // Import app after test utilities are defined
  const { default: app } = await import('../index');

  let ownerToken = '';
  let otherOwnerToken = '';
  let ownerId: string;
  let owner1ClientId: string;
  let owner2ClientId: string;

  // Setup: Register and login test users
  console.log('📋 Setting up test users...\n');

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  await request(app)
    .post('/api/register')
    .send({
      username: `test_owner_${Date.now()}`,
      password: 'password123',
      email: `owner1_${Date.now()}@test.com`,
      businessName: 'Test Business 1'
    });

  const owner1Login = await request(app)
    .post('/api/login')
    .send({ username: `test_owner_${Date.now() - 1}`, password: 'password123' });

  if (owner1Login.headers['set-cookie']) {
    ownerToken = owner1Login.headers['set-cookie'][0];
    ownerId = owner1Login.body.id;
  }

  await request(app)
    .post('/api/register')
    .send({
      username: `test_owner2_${Date.now()}`,
      password: 'password123',
      email: `owner2_${Date.now()}@test.com`,
      businessName: 'Test Business 2'
    });

  const owner2Login = await request(app)
    .post('/api/login')
    .send({ username: `test_owner2_${Date.now() - 1}`, password: 'password123' });

  if (owner2Login.headers['set-cookie']) {
    otherOwnerToken = owner2Login.headers['set-cookie'][0];
  }

  // Create test clients
  const client1 = await request(app)
    .post('/api/clients')
    .set('Cookie', ownerToken)
    .send({
      name: 'Owner1 Client',
      email: `client1_${Date.now()}@test.com`,
      phone: '123-456-7890'
    });
  owner1ClientId = client1.body.id;

  const client2 = await request(app)
    .post('/api/clients')
    .set('Cookie', otherOwnerToken)
    .send({
      name: 'Owner2 Client',
      email: `client2_${Date.now()}@test.com`,
      phone: '098-765-4321'
    });
  owner2ClientId = client2.body.id;

  console.log('🧪 Running tests...\n');

  // Test 1: Authentication enforcement
  await test('Reject unauthenticated GET /api/clients', async () => {
    const res = await request(app).get('/api/clients');
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  })();

  await test('Reject unauthenticated POST /api/clients', async () => {
    const res = await request(app).post('/api/clients').send({ name: 'Test' });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  })();

  // Test 2: Ownership validation
  await test('Prevent cross-tenant client access', async () => {
    const res = await request(app)
      .get(`/api/clients/${owner2ClientId}`)
      .set('Cookie', ownerToken);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  })();

  await test('Prevent cross-tenant client update', async () => {
    const res = await request(app)
      .patch(`/api/clients/${owner2ClientId}`)
      .set('Cookie', ownerToken)
      .send({ name: 'Hacked' });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  })();

  await test('Prevent cross-tenant client deletion', async () => {
    const res = await request(app)
      .delete(`/api/clients/${owner2ClientId}`)
      .set('Cookie', ownerToken);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  })();

  await test('List only own clients', async () => {
    const res = await request(app)
      .get('/api/clients')
      .set('Cookie', ownerToken);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const hasOtherOwnerClient = res.body.some((c: any) => c.id === owner2ClientId);
    if (hasOtherOwnerClient) throw new Error('Found other owner\'s client in list');
  })();

  // Test 3: Schema validation (.strict() mode)
  await test('Reject client creation with unknown fields', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Cookie', ownerToken)
      .send({
        name: 'Test',
        email: `test_${Date.now()}@test.com`,
        phone: '123-456-7890',
        unknownField: 'bad',
        isAdmin: true
      });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (!res.body.error?.includes('Unrecognized key')) {
      throw new Error('Should reject unknown fields');
    }
  })();

  await test('Reject proposal creation with unknown fields', async () => {
    const res = await request(app)
      .post('/api/proposals')
      .set('Cookie', ownerToken)
      .send({
        clientId: owner1ClientId,
        title: 'Test Proposal',
        amount: 1000,
        status: 'draft',
        maliciousField: 'inject'
      });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (!res.body.error?.includes('Unrecognized key')) {
      throw new Error('Should reject unknown fields');
    }
  })();

  await test('Reject staff creation with unknown fields', async () => {
    const res = await request(app)
      .post('/api/staff')
      .set('Cookie', ownerToken)
      .send({
        name: 'John Doe',
        email: `staff_${Date.now()}@test.com`,
        phone: '123-456-7890',
        role: 'photographer',
        isAdmin: true
      });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    if (!res.body.error?.includes('Unrecognized key')) {
      throw new Error('Should reject unknown fields');
    }
  })();

  // Test 4: Nested resource ownership
  await test('Prevent access to other owner\'s proposals', async () => {
    const proposal = await request(app)
      .post('/api/proposals')
      .set('Cookie', otherOwnerToken)
      .send({
        clientId: owner2ClientId,
        title: 'Secret Proposal',
        amount: 5000,
        status: 'draft'
      });

    const res = await request(app)
      .get(`/api/proposals/${proposal.body.id}`)
      .set('Cookie', ownerToken);
    
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  })();

  // Test 5: DELETE operations with rowCount checks
  await test('Delete returns false for non-existent client', async () => {
    const res = await request(app)
      .delete('/api/clients/non-existent-id')
      .set('Cookie', ownerToken);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  })();

  await test('Delete returns false for other owner\'s proposal', async () => {
    const proposal = await request(app)
      .post('/api/proposals')
      .set('Cookie', otherOwnerToken)
      .send({
        clientId: owner2ClientId,
        title: 'To Delete',
        amount: 1000,
        status: 'draft'
      });

    const res = await request(app)
      .delete(`/api/proposals/${proposal.body.id}`)
      .set('Cookie', ownerToken);
    
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  })();

  // Test 6: Special action endpoints security
  await test('Prevent converting other owner\'s proposal to booking', async () => {
    const proposal = await request(app)
      .post('/api/proposals')
      .set('Cookie', otherOwnerToken)
      .send({
        clientId: owner2ClientId,
        title: 'Other Owner Proposal',
        amount: 2000,
        status: 'accepted'
      });

    const res = await request(app)
      .post(`/api/proposals/${proposal.body.id}/convert-to-booking`)
      .set('Cookie', ownerToken);
    
    if (res.status !== 400 && res.status !== 404) {
      throw new Error(`Expected 404 or 400, got ${res.status}`);
    }
  })();

  await test('Prevent approving other owner\'s staff application', async () => {
    const application = await request(app)
      .post('/api/staff-applications')
      .send({
        ownerId: owner2.id,
        firstName: 'Jane',
        lastName: 'Smith',
        email: `jane_${Date.now()}@test.com`,
        phone: '987-654-3210',
        position: 'DJ',
        experience: '5 years'
      });

    const res = await request(app)
      .post(`/api/staff-applications/${application.body.id}/approve`)
      .set('Cookie', ownerToken);
    
    if (res.status !== 400 && res.status !== 404) {
      throw new Error(`Expected 404 or 400, got ${res.status}`);
    }
  })();

  await test('Prevent rejecting other owner\'s staff application', async () => {
    const application = await request(app)
      .post('/api/staff-applications')
      .send({
        ownerId: owner2.id,
        firstName: 'Bob',
        lastName: 'Johnson',
        email: `bob_${Date.now()}@test.com`,
        phone: '555-555-5555',
        position: 'Photographer',
        experience: '3 years'
      });

    const res = await request(app)
      .post(`/api/staff-applications/${application.body.id}/reject`)
      .set('Cookie', ownerToken);
    
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  })();

  // Summary
  console.log('\n📊 Test Summary\n');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n🎉 All security tests passed!');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
