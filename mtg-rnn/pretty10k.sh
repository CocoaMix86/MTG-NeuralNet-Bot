#!/bin/bash
rm prime_2.txt

FILES=~/mtg-rnn/10k_*
for f in $FILES
do
sed -i 's/D/2/g' $f
cat $f | tail -n +8 >> 10k_2.txt
done

var0="$1"
var1="nomse"

if [ "$var0" = "$var1" ]; then
sed -i 's/\\\\/$$/g' 10k_2.txt
~/mtgencode/decode.py 10k_2.txt /mnt/c/mtg-rnn/primepretty.txt -d
else
~/mtgencode/decode.py 10k_2.txt /mnt/c/mtg-rnn/primepretty.txt -d -mse
fi

rm 10k_*
