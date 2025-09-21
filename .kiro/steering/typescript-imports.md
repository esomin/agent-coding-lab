# TypeScript Import Rules

## Import Style Guidelines

모든 TypeScript 파일에서 다음 import 규칙을 따라야 합니다:

### 1. Type-only Imports
타입만 import할 때는 `import type` 구문을 사용합니다:

```typescript
import type { SomeType, AnotherType } from './types';
```

### 2. Mixed Imports
타입과 값을 함께 import할 때는 분리해서 작성합니다:

```typescript
import { someFunction, someConstant } from './module';
import type { SomeType, AnotherType } from './module';
```

### 3. Interface Imports
인터페이스를 구현할 때는 `type` 키워드를 사용합니다:

```typescript
import type { SomeInterface as ISomeInterface } from './interfaces';

export class SomeClass implements ISomeInterface {
  // implementation
}
```

### 4. Re-exports
타입을 re-export할 때도 `export type` 구문을 사용합니다:

```typescript
export type { SomeType, AnotherType } from './types';
```

### 5. Import Order
Import 순서는 다음과 같이 정렬합니다:

1. 외부 라이브러리 imports
2. 내부 모듈 imports (값)
3. 내부 모듈 imports (타입)

```typescript
// 외부 라이브러리
import React from 'react';
import { useState } from 'react';

// 내부 모듈 (값)
import { someFunction } from '../utils';
import { SomeClass } from '../services';

// 내부 모듈 (타입)
import type { SomeType } from '../types';
import type { SomeInterface } from '../interfaces';
```

이 규칙을 모든 TypeScript 파일에 적용해야 합니다.