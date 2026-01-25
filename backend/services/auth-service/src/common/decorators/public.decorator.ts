import { SetMetadata } from '@nestjs/common';

// Used reflectively by guards (SetMetadata). Kept intentionally exported.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
