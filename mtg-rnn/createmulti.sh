#!/bin/bash
#echo "$1, $2, $3, $4, $5, $6"
index=$3
array=(/mnt/c/mtg-rnn/$6/*.t7)
#echo "${array}"
#echo "${array[$index]}"

th sample.lua "${array[$index]}" -primetext "|5|

$4" -gpuid -1 -temperature "$1" -length "$5" -seed "$2" > multiprime_$2.txt

#cat prime_$2.txt | tail -n +8 | { head -n 1; echo ""; } >> prime_2.txt
#echo -e '\n\n' >> prime_2.txt
