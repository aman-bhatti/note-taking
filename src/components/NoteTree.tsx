import React, { useEffect, useState, useRef } from "react";
import { ForceGraph2D } from "react-force-graph";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../auth/AuthContext";
import * as d3 from "d3-force"; // Import the D3 force functions
import { schemeCategory10 } from "d3-scale-chromatic"; // Import the color scheme

interface Note {
  id: string;
  title: string;
  category: string;
}

interface GraphNode {
  id: string;
  name: string;
  isCategory?: boolean;
  color?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

const GraphView: React.FC = () => {
  const { currentUser } = useAuth();
  const [graphData, setGraphData] = useState<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>({
    nodes: [],
    links: [],
  });

  const graphRef = useRef<any>();

  useEffect(() => {
    const fetchNotes = async () => {
      if (currentUser) {
        const userDocRef = collection(db, "users", currentUser.email!, "notes");
        const querySnapshot = await getDocs(userDocRef);
        const notes: Note[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          category: doc.data().category,
        }));

        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];

        const categorySet = new Set<string>();
        const usedColors = new Set<string>();
        const colorPalette = schemeCategory10.slice(); // Copy the color palette

        const getNextColor = () => {
          // Get the next available color from the palette
          for (let i = 0; i < colorPalette.length; i++) {
            const color = colorPalette[i];
            if (!usedColors.has(color)) {
              usedColors.add(color);
              return color;
            }
          }
          // If all colors are used, return a default color (should not happen with small palettes)
          return "#000000";
        };

        notes.forEach((note) => {
          // Add category node if it hasn't been added yet
          if (!categorySet.has(note.category)) {
            categorySet.add(note.category);
            nodes.push({
              id: note.category,
              name: note.category,
              isCategory: true, // Identify as a category node
              color: getNextColor(), // Assign a unique color to category node
            });
          }

          // Add note node
          nodes.push({
            id: note.id,
            name: note.title,
            color: "#888888", // Use a grayish color for notes
          });

          // Link note to its category
          links.push({
            source: note.category,
            target: note.id,
          });
        });

        setGraphData({ nodes, links });

        // Adjust forces after data is set
        if (graphRef.current) {
          graphRef.current.d3Force("charge").strength(-5); // Reduce the repulsion force
          graphRef.current.d3Force("link").distance(20); // Allow nodes to be closer
          graphRef.current.d3Force("collision", d3.forceCollide().radius(5)); // Decrease the collision radius
        }
      }
    };

    fetchNotes();
  }, [currentUser]);

  return (
    <div className="p-6 max-w-site mx-auto container">
      <h1 className="text-3xl font-bold mb-4">Graph View</h1>
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = node.color || "#000"; // Use the assigned color for categories, default to black for notes
          ctx.fillText(label, node.x!, node.y!);

          const radius = node.isCategory ? 10 : 3; // Larger radius for categories, smaller for notes

          ctx.beginPath();
          ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI, false);
          ctx.fillStyle = node.color || "#000"; // Use the assigned color for categories, default to black for notes
          ctx.fill();
        }}
        linkDirectionalParticles={4}
        linkDirectionalParticleSpeed={0.004}
        onNodeClick={(node: any) => {
          if (!node.isCategory) {
            window.location.href = `/note/${(node as GraphNode).id}`;
          }
        }}
        width={800}
        height={600}
      />
    </div>
  );
};

export default GraphView;
