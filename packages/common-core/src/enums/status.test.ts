import { Status } from './status';
import { Visibility } from './visibility';

describe('Status enum', () => {
  it('should have all expected status values', () => {
    expect(Status.DRAFT).toBeDefined();
    expect(Status.IN_REVIEW).toBeDefined();
    expect(Status.PUBLISHED).toBeDefined();
    expect(Status.ARCHIVED).toBeDefined();
  });

  it('should stringify correctly', () => {
    expect(String(Status.DRAFT)).toBe('draft');
    expect(String(Status.PUBLISHED)).toBe('published');
  });
});

describe('Visibility enum', () => {
  it('should have all expected visibility values', () => {
    expect(Visibility.PRIVATE).toBeDefined();
    expect(Visibility.PUBLIC).toBeDefined();
    expect(Visibility.UNLISTED).toBeDefined();
  });
});
