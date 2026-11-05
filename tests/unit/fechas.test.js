import { describe, it, expect } from 'vitest';
import { hoyLocal, esFechaValida, formatearFecha } from '../../src/fechas.js';

describe('hoyLocal', () => {
  it('devuelve la fecha local en formato AAAA-MM-DD', () => {
    expect(hoyLocal(new Date(2026, 10, 5, 12, 0))).toBe('2026-11-05');
  });

  it('usa el día local aunque sea casi medianoche', () => {
    expect(hoyLocal(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
    expect(hoyLocal(new Date(2026, 10, 6, 0, 0))).toBe('2026-11-06');
  });

  it('rellena con ceros el mes y el día', () => {
    expect(hoyLocal(new Date(2026, 0, 1, 8, 30))).toBe('2026-01-01');
  });
});

describe('esFechaValida', () => {
  it('acepta fechas reales con el formato AAAA-MM-DD', () => {
    expect(esFechaValida('2026-11-05')).toBe(true);
    expect(esFechaValida('2028-02-29')).toBe(true);
  });

  it('rechaza fechas que no existen en el calendario', () => {
    expect(esFechaValida('2026-02-29')).toBe(false);
    expect(esFechaValida('2026-02-30')).toBe(false);
    expect(esFechaValida('2026-13-01')).toBe(false);
    expect(esFechaValida('2026-00-10')).toBe(false);
  });

  it('rechaza textos con otro formato o vacíos', () => {
    expect(esFechaValida('05/11/2026')).toBe(false);
    expect(esFechaValida('2026-1-5')).toBe(false);
    expect(esFechaValida('')).toBe(false);
    expect(esFechaValida(null)).toBe(false);
    expect(esFechaValida(undefined)).toBe(false);
  });
});

describe('formatearFecha', () => {
  it('muestra la fecha en español', () => {
    expect(formatearFecha('2026-11-06')).toBe('6 nov 2026');
    expect(formatearFecha('2026-01-15')).toBe('15 ene 2026');
  });

  it('no desplaza el día por la zona horaria', () => {
    expect(formatearFecha('2026-03-01')).toBe('1 mar 2026');
  });
});
