#!/bin/bash
rm prime_2.txt

FILES=~/mtg-rnn/pack_*
for f in $FILES
do
sed -i 's/mythic/mythic rare/g' $f
sed -i 's/D/2/g' $f
cat $f | tail -n +8 | { head -n 1; echo ""; } >> pack_2.txt
done

var0="$1"
var1="nomse"

if [ "$var0" = "$var1" ]; then
~/mtgencode/decode.py pack_2.txt /mnt/c/mtg-rnn/packpretty.txt -d
else
~/mtgencode/decode.py pack_2.txt /mnt/c/mtg-rnn/packpretty.txt -d -mse
fi

rm pack_*
