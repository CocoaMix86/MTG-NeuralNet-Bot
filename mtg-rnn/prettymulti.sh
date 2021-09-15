#!/bin/bash
rm multiprime.txt

FILES=~/mtg-rnn/multiprime_*
for f in $FILES
do
sed -i 's/mythic/mythic rare/g' $f
sed -i 's/D/2/g' $f
cat $f | tail -n +8 | { head -n 1; echo ""; } >> multiprime.txt
done

rm multiprime_*
