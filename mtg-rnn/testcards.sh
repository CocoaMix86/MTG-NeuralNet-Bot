#!/bin/bash
rm prime_3.txt

FILES=~/mtg-rnn/prime_*
for f in $FILES
do
sed -i 's/mythic/mythic rare/g' $f
sed -i 's/D/2/g' $f
cat $f | tail -n +8 | { head -n 1; echo ""; } >> prime_3.txt
done

var0="$1"
var1="nomse"

if [ "$var0" = "text" ] || [ "$var0" = "txt" ]; then
sed -i 's/\\\\/$$/g' prime_3.txt
~/mtgencode/decode.py prime_3.txt /mnt/c/mtg-rnn/primepretty.txt -d
else
~/mtgencode/decode.py prime_3.txt /mnt/c/mtg-rnn/primepretty.txt -d -mse
fi

rm prime_*
