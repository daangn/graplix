import "./App.css";
import { parse } from "graplix";

function App() {
  const schema = parse(`
    model
      schema 1.1

    type user

    type team
      relations
        define member: [user]
  `);

  return <div>{JSON.stringify(schema)}</div>;
}

export default App;
