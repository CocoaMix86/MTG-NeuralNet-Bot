#!/bin/bash
echo "$1, $2, $3, $4, $5, $6"
index=$3
array=(/mnt/c/mtg-rnn/model_random/*.t7)
echo "${array[$index]}"

rm /mnt/c/mtg-rnn/primepretty.txt
rm prime.txt

th sample.lua "${array[$index]}" -primetext "|5|

$4" -gpuid -1 -temperature "$1" -length "$5" -seed "$2" > prime.txt

tail -n +8 < prime.txt > prime2.txt

var0="$6"
var1="nomse"
if [ "$var0" = "$var1" ]; then
~/mtgencode/decode.py prime2.txt /mnt/c/mtg-rnn/primepretty.txt -d
else
~/mtgencode/decode.py prime2.txt /mnt/c/mtg-rnn/primepretty.txt -d -mse
fi
