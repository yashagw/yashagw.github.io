import React from 'react'
import { motion } from "framer-motion";

type Props = {}

const Loading = (props: Props) => {
  return (
    <motion.div
        id="loading"
        initial={{ scale: 1.0, opacity: 0.25 }}
        animate={{ scale: 2.0, opacity: 0.75 }}
        transition={{
            yoyo: Infinity,
            duration: 1.0,
            ease: "easeIn",
        }}
    >
        <img
        alt="Parth Mittal"
        className="w-[80px] h-[80px]"
        />
    </motion.div>
  )
}

export default Loading