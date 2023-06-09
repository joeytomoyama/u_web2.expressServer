import Login from "./Login"

export default function LandingPage() {
  return (
    <div
      id="LandingPage"
      className="centered"
      // style={{
      //   display: "flex",
      //   justifyContent: "center",
      //   alignItems: "center",
      //   height: "100%",
      // }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          borderRadius: "5px",
          backgroundColor: "grey",
          height: "20rem",
          width: "40rem",
        }}
      >
        <h3>{`Welcome to the ${import.meta.env.VITE_UNI_NAME} Webpage`}</h3>
        <Login />
      </div>
    </div>
  )
}
