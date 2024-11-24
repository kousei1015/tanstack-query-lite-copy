import axios from "axios";
import { useQuery } from "./query-lite/query-lite";
import { Link } from "react-router-dom";

type Users = {
  id: string;
  name: string;
}[];

function usePosts() {
  return useQuery<Users>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/users"
      );
      return data;
    },
    staleTime: 0,
    cacheTime: 300000,
  });
}

const Users = () => {
  const usersQuery = usePosts();

  if (usersQuery.status === "loading") {
    return <div>Loading...</div>;
  }

  if (usersQuery.status === "error") {
    return <div>Error</div>;
  }

  const { data } = usersQuery;

  return (
    <div>
      <h1>Users</h1>
      <Link to="/posts">Posts一覧ページへ飛ぶ</Link>
      {data?.map((user) => (
        <p key={user.id}>{user.name}</p>
      ))}
    </div>
  );
};

export default Users;
