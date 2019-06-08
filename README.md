# state-context

Simple state-management with React Context API

## Install

```
npm install state-context
```

## Idea

1. In best case you just need to change 2 lines of code in your component to switch from local to global state:

Before:

```tsx
  const [name, setName] = React.useState();
```

After:

```tsx
  const context = React.useContext(MyStateContext);
  const [name, setName] = context.useState.name;
```

2. It's useful for cases where Redux boilerplate would be an overhead (it has no actions, action-creators, reducers, mappings etc.)
3. You can set up one global state or multiple shared states.
4. It's still deterministic as you can attach middleware and watch/undo/redo.
5. You have TypeScript support out of the box.
