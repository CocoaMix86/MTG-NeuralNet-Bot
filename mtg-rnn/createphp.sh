#!/bin/bash
index=69
array=(/mnt/c/mtg-rnn/model_random/*.t7)

th sample.lua "${array[$index]}" -primetext "|5|

" -gpuid -1 -temperature 1 -length 300 -seed "$1" > phpcard.txt

tail phpcard.txt -n +8 | { head -n 1; echo ""; } > phpcard2.txt

#cat phpcard2.txt
#~/mtgencode/decode.py primephp2.txt primephppretty.txt -d
#cat primephppretty.txt
