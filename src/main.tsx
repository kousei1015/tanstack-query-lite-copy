import ReactDOM from "react-dom/client";
import Users from "./Users.tsx";
import Posts from "./Posts.tsx";
import { QueryClientProvider, QueryClient } from "./query-lite/query-lite.js";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const client = new QueryClient();

/*
  以下の、UsersコンポーネントとPostsコンポーネントは、
  データのキャッシュが正常に行われるかどうかの確認用です。
  データのキャッシュが行われているのなら、
  Usersコンポーネントでユーザーのデータを取得した後、
  「/posts」パスへ飛び、Postsコンポーネントへ行った後、デフォルト状態では5分、
  ローディングが発生しないはずです。
*/

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={client}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Users />} />
        <Route path="/posts" element={<Posts />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);
