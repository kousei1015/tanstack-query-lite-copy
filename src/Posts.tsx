import axios from "axios";
import { useQuery } from "./query-lite/query-lite";
import { Link } from "react-router-dom";

type Posts = {
  id: string;
  title: string;
}[];

function usePosts() {
  return useQuery<Posts>({
    queryKey: ["posts"],
    queryFn: async () => {
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/posts"
      );
      return data;
    },
    staleTime: 0,
    cacheTime: 300000,
  });
}

const Posts = () => {
  const postsQuery = usePosts();

  if (postsQuery.status === "loading") {
    return <div>Loading...</div>;
  }

  if (postsQuery.status === "error") {
    return <div>Error</div>;
  }

  const { data } = postsQuery;

  return (
    <div>
      <h1>Posts</h1>
      <Link to="/">Users一覧ページへ飛ぶ</Link>
      {data?.map((post) => (
        <p key={post.id}>{post.title}</p>
      ))}
    </div>
  );
};

export default Posts;
