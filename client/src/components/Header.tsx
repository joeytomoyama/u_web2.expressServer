import Login from "./Login"

export default function Header() {
  return (
    <div
      id="Header"
      style={{
        backgroundColor: "black",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignContent: "center",
        flexDirection: "row",
        top: "0",
        width: "100%",
        padding: "10px",
      }}
    >
      <h1>{import.meta.env.VITE_UNI_NAME}</h1>
      <Login />
    </div>
  )
}
