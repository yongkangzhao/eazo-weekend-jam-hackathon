#!/usr/bin/env bash
set -euo pipefail

# Usage: npm run scaffold -- my-demo-name "My Demo Title" "Description here" "text-to-image,text-to-speech" "author"

SLUG="${1:?Usage: scaffold <slug> <title> <description> <apis> <author>}"
TITLE="${2:?Missing title}"
DESC="${3:?Missing description}"
APIS="${4:?Missing apis (comma-separated)}"
AUTHOR="${5:-team}"

DEMO_DIR="src/app/demos/${SLUG}"

if [ -d "$DEMO_DIR" ]; then
  echo "Error: Demo '${SLUG}' already exists at ${DEMO_DIR}"
  exit 1
fi

echo "Scaffolding demo: ${SLUG}..."

mkdir -p "$DEMO_DIR"

cat > "${DEMO_DIR}/page.tsx" << EOF
"use client";

import { useState } from "react";

export default function DemoPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <a
        href="/"
        className="text-sm text-gray-400 hover:text-gray-200 mb-6 inline-block"
      >
        &larr; Back to Gallery
      </a>
      <h1 className="text-2xl font-bold mb-2">${TITLE}</h1>
      <p className="text-gray-400 mb-6">${DESC}</p>

      {/* TODO: Build your demo UI here */}
      <div className="rounded-lg border-2 border-dashed border-gray-700 py-20 text-center text-gray-500">
        Demo coming soon
      </div>
    </div>
  );
}
EOF

# Build the apis array string
IFS=',' read -ra API_ARRAY <<< "$APIS"
APIS_JSON="["
for i in "${!API_ARRAY[@]}"; do
  [ "$i" -gt 0 ] && APIS_JSON+=", "
  APIS_JSON+="\"${API_ARRAY[$i]}\""
done
APIS_JSON+="]"

# Append to demos.ts registry
sed -i.bak "s/^];/  {\n    slug: \"${SLUG}\",\n    title: \"${TITLE}\",\n    description: \"${DESC}\",\n    apis: ${APIS_JSON},\n    author: \"${AUTHOR}\",\n    status: \"wip\",\n  },\n];/" src/demos.ts
rm -f src/demos.ts.bak

echo "Done! Created ${DEMO_DIR}/page.tsx and registered in src/demos.ts"
echo "Start dev server: npm run dev"
echo "Visit: http://localhost:3000/demos/${SLUG}"
