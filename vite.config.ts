import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
import path from "path"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./client"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    reactVendor: ["react", "react-dom"],
                    router: ["react-router-dom"],
                    query: ["@tanstack/react-query"],
                    table: ["@tanstack/react-table"],
                    charts: ["recharts"],
                    three: ["three", "@react-three/fiber", "@react-three/drei"],
                },
            },
        },
    },
})