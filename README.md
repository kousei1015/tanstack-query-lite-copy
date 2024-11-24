# tanstack-query-lite-with-type

react-queryを簡易的に再現したものに、型付けを行ってみたものです。
react-queryを簡易的に再現したものを作るには、以下の動画を参考にしました。

https://www.youtube.com/watch?v=9SrIirrnwk0

しかし、以上の動画では型付けがなされていません。自分は最近、Typescriptを学習しているので、それを実践するために、型付けを行ってみることにしました。以下がそのコードです。あくまで簡易的に再現しただけに過ぎませんが、

```
import * as React from "react";

type QueryState<T> = {
  status: "loading" | "success" | "error";
  isFetching: boolean;
  data: T | undefined;
  error: Error | null;
  lastUpdated?: number;
};

type QueryOptions<T> = {
  queryKey: any[];
  queryFn: () => Promise<T>;
  staleTime?: number;
  cacheTime?: number;
};

type Query<T = any> = {
  queryKey: unknown[];
  queryHash: string;
  promise: Promise<void> | null;
  subscribers: QueryObserver<T>[];
  gcTimeout: number | null;
  state: QueryState<T>;
  setState: (updater: (state: QueryState<T>) => QueryState<T>) => void;
  subscribe: (observer: QueryObserver<T>) => () => void;
  scheduleGC: () => void;
  unscheduleGC: () => void;
  fetch: () => Promise<void>;
};

type QueryObserver<T> = {
  notify: () => void;
  getResult: () => QueryState<T>;
  subscribe: (callback: () => void) => () => void;
  fetch: () => void;
};

type QueryClientOptions = {
  queries: Query<unknown>[];
};

export class QueryClient {
  queries: Query[];

  constructor(options?: QueryClientOptions) {
    this.queries = options?.queries || [];
  }

  getQuery<T>(options: QueryOptions<T>): Query<T> {
    const queryHash = JSON.stringify(options.queryKey);
    let query = this.queries.find((d) => d.queryHash === queryHash);

    if (!query) {
      query = createQuery(this, options);
      this.queries.push(query);
    }

    return query;
  }
}

const context = React.createContext<QueryClient | undefined>(undefined);

export function QueryClientProvider({
  children,
  client,
}: {
  children: React.ReactNode;
  client: QueryClient;
}) {
  return <context.Provider value={client}>{children}</context.Provider>;
}

export function useQuery<T = unknown>({
  queryKey,
  queryFn,
  staleTime,
  cacheTime,
}: QueryOptions<T>): QueryState<T> {
  const client = React.useContext(context);
  if (!client) {
    throw new Error("useQuery must be used within a QueryClientProvider");
  }

  const [, rerender] = React.useReducer((i) => i + 1, 0);
  const observerRef = React.useRef<QueryObserver<T>>();
  if (!observerRef.current) {
    observerRef.current = createQueryObserver(client, {
      queryKey,
      queryFn,
      staleTime,
      cacheTime,
    });
  }

  React.useEffect(() => {
    return observerRef.current!.subscribe(rerender);
  }, []);

  return observerRef.current.getResult();
}

function createQuery<T = unknown>(
  client: QueryClient,
  { queryKey, queryFn, cacheTime = 5 * 60 * 1000 }: QueryOptions<T>
): Query<T> {
  let query: Query<T> = {
    queryKey,
    queryHash: JSON.stringify(queryKey),
    promise: null,
    subscribers: [],
    gcTimeout: null,
    state: {
      status: "loading",
      isFetching: true,
      data: undefined,
      error: null,
    },
    setState(updater) {
      query.state = updater(query.state);
      query.subscribers.forEach((subscriber) => subscriber.notify());
    },
    subscribe(subscriber) {
      query.subscribers.push(subscriber);
      query.unscheduleGC();

      return () => {
        query.subscribers = query.subscribers.filter((d) => d !== subscriber);
        if (!query.subscribers.length) {
          query.scheduleGC();
        }
      };
    },
    scheduleGC() {
      query.gcTimeout = setTimeout(() => {
        client.queries = client.queries.filter((d) => d !== query);
      }, cacheTime);
    },
    unscheduleGC() {
      if (query.gcTimeout) {
        clearTimeout(query.gcTimeout);
      }
    },
    async fetch() {
      if (!query.promise) {
        query.promise = (async () => {
          query.setState((old) => ({
            ...old,
            isFetching: true,
            error: null,
          }));
          try {
            const data = await queryFn();

            query.setState((old) => ({
              ...old,
              status: "success",
              lastUpdated: Date.now(),
              data,
            }));
          } catch (error) {
            query.setState((old) => ({
              ...old,
              status: "error",
              error: error as Error,
            }));
          } finally {
            query.promise = null;
            query.setState((old) => ({
              ...old,
              isFetching: false,
            }));
          }
        })();
      }

      return query.promise;
    },
  };

  return query;
}

function createQueryObserver<T>(
  client: QueryClient,
  options: QueryOptions<T>
): QueryObserver<T> {
  const query = client.getQuery(options);

  const observer: QueryObserver<T> = {
    notify: () => {},
    getResult: () => query.state,
    subscribe(callback) {
      observer.notify = callback;
      const unsubscribe = query.subscribe(observer);

      observer.fetch();

      return unsubscribe;
    },
    fetch() {
      if (
        !query.state.lastUpdated ||
        Date.now() - query.state.lastUpdated > (options.staleTime || 0)
      ) {
        query.fetch();
      }
    },
  };

  return observer;
}
```