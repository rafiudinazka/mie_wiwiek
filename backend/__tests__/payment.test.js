const {
  SimulatedPayment,
  getPaymentService,
} = require('../payment');

describe('SimulatedPayment', () => {
  let payment;

  beforeAll(() => {
    payment = new SimulatedPayment();
  });

  describe('createPayment', () => {
    it('returns success with transaction ID', async () => {
      const result = await payment.createPayment(1, 25000, {
        name: 'Budi',
        phone: '08123456789',
      });

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^SIM-1-/);
      expect(result.paymentMethod).toBe('simulated');
      expect(result.message).toBe('Payment simulated successfully');
    });

    it('includes order ID in transaction ID', async () => {
      const result = await payment.createPayment(42, 50000, {
        name: 'Siti',
        phone: '08987654321',
      });

      expect(result.transactionId).toContain('SIM-42-');
    });
  });

  describe('checkStatus', () => {
    it('returns success status', async () => {
      const result = await payment.checkStatus('SIM-1-123');

      expect(result.status).toBe('success');
      expect(result.message).toBe('Simulated payment completed');
    });
  });

  describe('handleWebhook', () => {
    it('returns orderId from payload', async () => {
      const result = await payment.handleWebhook({ orderId: 5 });

      expect(result.orderId).toBe(5);
      expect(result.status).toBe('success');
    });
  });
});

describe('getPaymentService', () => {
  it('returns SimulatedPayment for "simulated" type', () => {
    const svc = getPaymentService('simulated');
    expect(svc).toBeInstanceOf(SimulatedPayment);
  });

  it('defaults to SimulatedPayment when no type specified', () => {
    const svc = getPaymentService();
    expect(svc).toBeInstanceOf(SimulatedPayment);
  });

  it('defaults to SimulatedPayment for unknown type', () => {
    const svc = getPaymentService('unknown');
    expect(svc).toBeInstanceOf(SimulatedPayment);
  });
});
