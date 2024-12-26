import { useState } from 'react'


import './App.css'

import axios from "axios";
import UploadReport from './UploadReport';
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <h1>Smart Case Analyzer</h1>
      
     <UploadReport/>
    </>
  )
}

export default App
