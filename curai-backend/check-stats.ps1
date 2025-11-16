#!/usr/bin/env pwsh

# Pinecone Index Statistics Checker
# Run with: .\check-stats.ps1

$env:PINECONE_API_KEY = "pcsk_3pCQ8i_FNkw3Sw7eHTLvXXhX2ChSpq9XeactxNVcPHoNxuNkisvgnULVJHBtF2bAZxdePJ"
$env:PINECONE_INDEX_NAME = "default"

Set-Location -Path "d:\curaai-platform\curai-backend"
node check-pinecone-stats.js
