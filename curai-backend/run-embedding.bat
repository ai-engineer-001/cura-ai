@echo off
REM Batch script to run embedding with fresh environment
cd /d "%~dp0"
set OPENROUTER_API_KEY=
set PINECONE_API_KEY=
node embed-datasets.js
pause
