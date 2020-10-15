mkdir out
mkdir out/static
cd fargpalett
go build
cp fargpalett ../out/fargpalett

cd ..
cd farg
npm run build
cp dist/* ../out/static/
cd..
