import { useEffect, useState } from "react"
import 'font-awesome/css/font-awesome.min.css';
import "@/app.scss"

import Loading from "@/components/Loading"
import HeroComponent from "./components/HeroComponent"

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTimeout(() => { setIsLoading(false) }, 1000)
  }, [])

  if (isLoading) {
     return (
      <div className="app">

      </div>
     )
  }else{
    return (
      <div className="app">
        <HeroComponent />
        <div>Another Section</div>
      </div>
    )
  }
}

export default App
