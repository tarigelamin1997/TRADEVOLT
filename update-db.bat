@echo off
echo Updating production database schema...
echo.
echo Make sure you have your production DATABASE_URL in .env file
echo.
cd trading-journal
npx prisma db push --skip-seed
echo.
echo Database update complete!
pause