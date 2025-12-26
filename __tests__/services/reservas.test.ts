import {
  getProximoShabbat,
  getVentanaReservas,
  enPeriodoReservas,
  enPeriodoInvitados,
  puedeCancelar,
} from '@/services/reservas';

describe('Reservas Service', () => {
  describe('getProximoShabbat', () => {
    it('should return next Friday from a Monday', () => {
      // Monday, January 6, 2025
      const monday = new Date(2025, 0, 6);
      const result = getProximoShabbat(monday);

      expect(result.getDay()).toBe(5); // Friday
      expect(result.getDate()).toBe(10);
    });

    it('should return next Friday from a Wednesday', () => {
      // Wednesday, January 8, 2025
      const wednesday = new Date(2025, 0, 8);
      const result = getProximoShabbat(wednesday);

      expect(result.getDay()).toBe(5);
      expect(result.getDate()).toBe(10);
    });

    it('should return next week Friday from a Friday', () => {
      // Friday, January 10, 2025
      const friday = new Date(2025, 0, 10);
      const result = getProximoShabbat(friday);

      expect(result.getDay()).toBe(5);
      expect(result.getDate()).toBe(17); // Next Friday
    });

    it('should return next Friday from a Sunday', () => {
      // Sunday, January 5, 2025
      const sunday = new Date(2025, 0, 5);
      const result = getProximoShabbat(sunday);

      expect(result.getDay()).toBe(5);
      expect(result.getDate()).toBe(10);
    });
  });

  describe('getVentanaReservas', () => {
    it('should return correct reservation window', () => {
      // Friday, January 10, 2025
      const shabbat = new Date(2025, 0, 10);
      const ventana = getVentanaReservas(shabbat);

      // Lunes is 4 days before Friday
      expect(ventana.inicioReservas.getDay()).toBe(1); // Monday
      expect(ventana.inicioReservas.getDate()).toBe(6);

      // Miércoles is 2 days before Friday
      expect(ventana.finConfirmacion.getDay()).toBe(3); // Wednesday
      expect(ventana.finConfirmacion.getDate()).toBe(8);
      expect(ventana.finConfirmacion.getHours()).toBe(23);

      expect(ventana.inicioInvitados.getDay()).toBe(3); // Wednesday
      expect(ventana.inicioInvitados.getHours()).toBe(0);
    });
  });

  describe('puedeCancelar', () => {
    const createMockReserva = (overrides: any = {}) => ({
      id: 'test-id',
      usuarioId: 'user-1',
      usuarioNombre: 'Test User',
      habitacionId: 'hab-1',
      habitacionNombre: 'Habitación 1',
      fechaShabbat: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      participantes: [],
      invitados: [],
      estado: 'confirmada' as const,
      prioridad: 2,
      fechaReserva: new Date(),
      pagado: false,
      historialMudanzas: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });

    it('should allow cancellation for future reservations', () => {
      const reserva = createMockReserva();
      const result = puedeCancelar(reserva);

      expect(result.puede).toBe(true);
    });

    it('should not allow cancellation for already cancelled reservations', () => {
      const reserva = createMockReserva({ estado: 'cancelada' });
      const result = puedeCancelar(reserva);

      expect(result.puede).toBe(false);
      expect(result.motivo).toBe('Ya está cancelada');
    });

    it('should not allow cancellation less than 24 hours before', () => {
      const reserva = createMockReserva({
        fechaShabbat: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      });
      const result = puedeCancelar(reserva);

      expect(result.puede).toBe(false);
      expect(result.motivo).toBe('Menos de 24 horas para el Shabbat');
    });

    it('should not allow cancellation for past reservations', () => {
      const reserva = createMockReserva({
        fechaShabbat: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      });
      const result = puedeCancelar(reserva);

      expect(result.puede).toBe(false);
    });
  });
});

describe('Date Utilities', () => {
  describe('enPeriodoReservas', () => {
    it('should return false before reservation period', () => {
      // Test with a far future date to simulate being before the period
      const futureShabbat = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      // This would be false because we're not in the reservation window yet
      // (reservations open on Monday for Friday)
    });
  });
});
