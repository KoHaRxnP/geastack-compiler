# Pebble counter size

The unmodified `counter-jsx` program builds to **9,736 bytes** with Pebble SDK
4.33.1 and LLVM/LLD 22.1.8. The same application and toolchain produced 51,336
bytes with compiler commit `1c82ebb53`.

The fix is confined to `gea_runtime.h`:

- Constant-initialized builtin wrappers keep unused Math functions out of the
  binary. Reading a function value still materializes its shared callable
  identity; direct calls need no allocation. Shared-runtime builtin storage
  retains its existing ABI.
- Constant-initialized reference-operation tables let unused types disappear.
- `GEA_RUNTIME_COMPACT_CODE`, already enabled by Pebble's prelude, shares
  reference-release bodies and only retains expando cleanup when the program
  creates an expando. Normal builds retain their existing inlining policy.

The collection algorithm and app source are unchanged. These numbers measure
the program image, not ELF file size or the full Pebble app bundle. Physical
watch behavior and frame time are not remeasured by this build-size check.

From the compiler checkout:

```sh
npm run build
npm run test:compact-runtime
node test/pebble-counter-size.mjs
```

The Pebble check requires the SDK, matching LLVM/LLD, and the sibling `examples`
and `pebble` repositories with dependencies installed. A separate compiler
checkout can supply both paths explicitly:

```sh
node test/pebble-counter-size.mjs /path/to/examples/apps/counter-jsx /path/to/pebble/packages/geastack-pebble/targets/pebble/build-pebble.sh
```

It uses this checkout's `dist/cli.js`, requires compiled UI, packages the app,
and fails if the program exceeds **10,000 bytes**. The compact-runtime suite
checks direct calls, callable identity, expando reclamation and cycle safepoints
under ASan/UBSan in normal and compact allocation modes. A separate linked
probe checks that an application using no Math functions contains no Math thunks.
