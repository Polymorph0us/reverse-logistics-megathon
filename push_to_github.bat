@echo off
echo Fixing Git Rebase and pushing to GitHub...
echo.

:: Abort any stuck rebase
git rebase --abort 2>nul

:: Pull latest from GitHub
git pull --rebase origin main

:: Add files
git add .

:: Commit (in case there's anything left)
git commit -m "feat: complete blockchain integration with true data storage" 2>nul

:: Push
git push -u origin main

echo.
echo === DONE! ===
pause
