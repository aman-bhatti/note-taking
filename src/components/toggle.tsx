// src/components/ToggleSwitch.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";

const ToggleSwitch: React.FC<{ isOn: boolean; onToggle: () => void }> = ({
  isOn,
  onToggle,
}) => {
  return (
    <div
      className={`w-16 h-8 flex items-center rounded-full p-1 cursor-pointer ${
        isOn ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-300"
      }`}
      onClick={onToggle}
    >
      <motion.div
        className="bg-white w-6 h-6 rounded-full shadow-md"
        layout
        transition={spring}
        style={{
          marginLeft: isOn ? "auto" : "0",
        }}
      />
    </div>
  );
};

const spring = {
  type: "spring",
  stiffness: 700,
  damping: 30,
};

export default ToggleSwitch;
