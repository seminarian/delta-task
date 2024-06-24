# Delta Invest Challenge

## Running the app inside docker environment
```bash
$ ./launch-prod-env.sh
```

## Running the app using local node (LTS)
```bash
$ pnpm install
$ docker-compose up -d
# development
$ pnpm run migration:run
$ pnpm run start

# watch mode
$ pnpm run migration:run
$ pnpm run start:dev
```

## Test

```bash
# e2e tests
$ pnpm run test:e2e
```