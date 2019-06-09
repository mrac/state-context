# state-context

Simple state-management with React Context API

## Install

```
npm install state-context
```

## Idea

`state-context` does state management for React. In terms of complexity it is located between using local state and Redux.

1. With `state-context` it's very easy to migrate your component from local state to global state:

<table>
<tr>
<td>
  Local state
</td>
<td>
  Global state with <code>state-context</code>
</td>
</tr>
<tr>
<td valign="top">
  
```tsx
import * as React from 'react';


const MyBirthday: React.SFC = () => {

  const [age, setAge] = React.useState(10);

  return (
    <button onClick={() => setAge(age + 1)}>
      Celebrate {age} birthday!
    </button>
  );
};
```
</td>
<td valign="top">
  
```tsx
import * as React from 'react';
import { MyStore } from './my-store';

const MyBirthday: React.SFC = () => {
  const context = React.useContext(MyStore);
  const [age, setAge] = context.useState.age;

  return (
    <button onClick={() => setAge(age + 1)}>
      Celebrate {age} birthday!
    </button>
  );
};
```
</td>
</tr>
</table>

2. It's useful for cases where Redux boilerplate would be an overhead (it still makes sense and is easy to decouple state management from UI layer).

<table>
<tr>
<td></td>
<td>Redux</td>
<td><code>state-context</code></td>
</tr>
<tr>
<td>actions.ts</td>
<td>YES</td>
<td>NO</td>
</tr>
<tr>
<td>actions.test.ts</td>
<td>YES</td>
<td>NO</td>
</tr>
<tr>
<td>reducer.ts</td>
<td>YES</td>
<td>NO</td>
</tr>
<tr>
<td>reducer.test.ts</td>
<td>YES</td>
<td>NO</td>
</tr>
<tr>
<td>container.tsx</td>
<td>YES</td>
<td>NO</td>
</tr>
<tr>
<td>container.test.tsx</td>
<td>YES</td>
<td>NO</td>
</tr>
<tr>
<td>side-effects.ts</td>
<td>YES</td>
<td>YES</td>
</tr>
<tr>
<td>side-effects.test.ts</td>
<td>YES</td>
<td>YES</td>
</tr>
<tr>
<td>ui-layer-component.tsx</td>
<td>YES</td>
<td>YES</td>
</tr>
<tr>
<td>ui-layer-component.test.tsx</td>
<td>YES</td>
<td>YES</td>
</tr>
</table>

3. You can set up one global store or multiple shared-state containers.
4. It's still deterministic as you can attach middleware and watch/undo/redo.
5. You have TypeScript support out of the box.
