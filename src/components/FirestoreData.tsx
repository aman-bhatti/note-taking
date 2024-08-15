// src/components/FirestoreData.tsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const FirestoreData: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, "myCollection"));
      setData(querySnapshot.docs.map((doc) => doc.data()));
    };

    fetchData();
  }, []);

  const handleAddData = async () => {
    try {
      await addDoc(collection(db, "myCollection"), { value: input });
      setInput("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div>
      <ul>
        {data.map((item, index) => (
          <li key={index}>{item.value}</li>
        ))}
      </ul>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add new data"
      />
      <button onClick={handleAddData}>Add</button>
    </div>
  );
};

export default FirestoreData;
