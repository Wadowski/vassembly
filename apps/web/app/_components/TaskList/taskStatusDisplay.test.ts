import { describe, it, expect } from 'vitest';

import {
  AlertCircleIcon,
  CheckCircleIcon,
  SingleNeutralCircleIcon,
  TimeClockCircleIcon,
} from '@vassembly/ui-system-design/icons';

import { getStatusColor, getStatusIcon, getStatusLabel } from './taskStatusDisplay';

describe('taskStatusDisplay', () => {
  describe('getStatusIcon', () => {
    it('should return TimeClockCircleIcon when status is created', () => {
      expect(getStatusIcon('created')).toBe(TimeClockCircleIcon);
    });

    it('should return SingleNeutralCircleIcon when status is in-progress', () => {
      expect(getStatusIcon('in-progress')).toBe(SingleNeutralCircleIcon);
    });

    it('should return CheckCircleIcon when status is done', () => {
      expect(getStatusIcon('done')).toBe(CheckCircleIcon);
    });

    it('should return AlertCircleIcon when status is failed', () => {
      expect(getStatusIcon('failed')).toBe(AlertCircleIcon);
    });
  });

  describe('getStatusColor', () => {
    it('should return secondary when status is created', () => {
      expect(getStatusColor('created')).toBe('secondary');
    });

    it('should return info when status is in-progress', () => {
      expect(getStatusColor('in-progress')).toBe('info');
    });

    it('should return success when status is done', () => {
      expect(getStatusColor('done')).toBe('success');
    });

    it('should return error when status is failed', () => {
      expect(getStatusColor('failed')).toBe('error');
    });
  });

  describe('getStatusLabel', () => {
    it('should return Created when status is created', () => {
      expect(getStatusLabel('created')).toBe('Created');
    });

    it('should return In progress when status is in-progress', () => {
      expect(getStatusLabel('in-progress')).toBe('In progress');
    });

    it('should return Done when status is done', () => {
      expect(getStatusLabel('done')).toBe('Done');
    });

    it('should return Failed when status is failed', () => {
      expect(getStatusLabel('failed')).toBe('Failed');
    });

    it('should return Unknown when status is invalid', () => {
      expect(getStatusLabel('invalid-status')).toBe('Unknown');
    });
  });
});
