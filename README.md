Demonstration project to query account balance and issue payments on [Stellar](https://www.stellar.org/) test network.

# Usage
Pull this project. From its root, start up a local data cloud:
```
docker compose up
```

Load this project on the data cloud:
```
npm run reset
```

Serve DRAW
```
npm run serve
```

> You may also [work on a remote data cloud instance](#working-on-a-remote-data-cloud-instance).

## Serve a backend service
```
npm run build:node
cd dist-node/
node main.js sc.app=017d58914a3432920c3f
```

# Working on a remote data cloud instance
Complete the unfilled fields `<...>` in file [oConfig-dist.json](res/oConfig-dist.json).
Then, add `:dist` to `npm run ...` commands, e.g. `npm run serve:dist`.

When working on a remote data cloud instance, you do not need to (and cannot) load anything on the data cloud.
