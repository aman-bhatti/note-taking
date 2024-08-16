import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  category: string;
}

interface TreeNode {
  name: string;
  children?: TreeNode[];
  itemStyle?: { color: string };
  label?: {
    color: string;
    position?: string;
    verticalAlign?: string;
    align?: string;
  };
  lineStyle?: { color: string; width?: number };
  noteId?: string;
}

const TreeChartView: React.FC = () => {
  const { currentUser } = useAuth();
  const [option, setOption] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotes = async () => {
      if (currentUser) {
        const userDocRef = collection(db, "users", currentUser.email!, "notes");
        const querySnapshot = await getDocs(userDocRef);
        const notes: Note[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          category: doc.data().category || "Uncategorized", // Default category if none is provided
        }));

        // Create a color palette
        const colorPalette = [
          "#d62728",
          "#1f77b4",
          "#2ca02c",
          "#ff7f0e",
          "#9467bd",
          "#8c564b",
          "#e377c2",
        ];
        const categoryMap: { [key: string]: TreeNode } = {};

        // Build the tree structure
        notes.forEach((note, index) => {
          if (!categoryMap[note.category]) {
            categoryMap[note.category] = {
              name: note.category,
              children: [],
              itemStyle: { color: colorPalette[index % colorPalette.length] }, // Assign color to category
              label: {
                color: colorPalette[index % colorPalette.length],
                position: "top", // Position label above the category node
                verticalAlign: "bottom", // Align label above the node
                align: "center", // Center the label horizontally
              },
              lineStyle: {
                color: colorPalette[index % colorPalette.length],
                width: 2,
              }, // Line color and width
            };
          }

          categoryMap[note.category].children!.push({
            name: note.title,
            noteId: note.id,
            itemStyle: { color: colorPalette[index % colorPalette.length] }, // Assign color to note
            label: {
              color: "#000",
              position: "right", // Keep note labels to the right
              verticalAlign: "middle",
              align: "left",
            },
            lineStyle: {
              color: colorPalette[index % colorPalette.length],
              width: 2,
            }, // Line color and width
          });
        });

        const data: TreeNode[] = [
          {
            name: "My Notes",
            children: Object.values(categoryMap),
            itemStyle: { color: "#333" }, // Root node color
            label: {
              color: "#333",
              position: "top",
              verticalAlign: "bottom",
              align: "center",
            },
            lineStyle: { color: "#333", width: 3 }, // Line style for the root node
          },
        ];

        const option = {
          tooltip: {
            trigger: "item",
            triggerOn: "mousemove",
            formatter: (params: any) => {
              return params.data.noteId
                ? `Note: ${params.name}`
                : `Category: ${params.name}`;
            },
          },
          series: [
            {
              type: "tree",
              data: data,
              top: "5%", // Adjust the top position to prevent overlap
              left: "10%", // Adjust the left position for better spacing
              bottom: "2%",
              right: "15%",
              symbolSize: 10,
              label: {
                position: "left",
                verticalAlign: "middle",
                align: "right",
                fontSize: 14,
              },
              itemStyle: {
                borderColor: "#777", // Border color for nodes
              },
              lineStyle: {
                width: 2,
                curveness: 0.5,
              },
              leaves: {
                label: {
                  position: "right",
                  verticalAlign: "middle",
                  align: "left",
                },
              },
              expandAndCollapse: true,
              initialTreeDepth: 2,
              animationDuration: 750,
            },
          ],
        };

        setOption(option);
      }
    };

    fetchNotes();
  }, [currentUser]);

  const handleChartClick = (params: any) => {
    const { data } = params;
    if (data.noteId) {
      navigate(`/note/${data.noteId}`);
    }
  };

  return (
    <div className="p-6 max-w-site mx-auto container">
      <h1 className="text-3xl font-bold mb-4">Tree Chart View</h1>
      <ReactECharts
        option={option}
        style={{ height: "600px", width: "100%" }}
        onEvents={{ click: handleChartClick }} // Add click event handler
      />
    </div>
  );
};

export default TreeChartView;
