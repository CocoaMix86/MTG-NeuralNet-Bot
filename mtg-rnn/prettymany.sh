#!/bin/bash
rm prime_2.txt

FILES=~/mtg-rnn/prime_*
for f in $FILES
do
sed -i 's/mythic/mythic rare/g' $f
sed -i 's/D/2/g' $f
cat $f | tail -n +8 >> prime_2.txt
done

var0="$1"
var1="nomse"

if [ "$var0" = "$var1" ]; then
sed -i 's/\\\\/$$/g' prime_2.txt
~/mtgencode/decode.py prime_2.txt /mnt/c/mtg-rnn/primepretty.txt -d
else
~/mtgencode/decode.py prime_2.txt /mnt/c/mtg-rnn/primepretty.txt -d -mse
fi

rm prime_*
