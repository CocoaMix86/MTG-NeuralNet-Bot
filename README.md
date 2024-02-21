# MTG-NeuralNet-Bot
A Discord bot for creating MTG cards by use of a neural network.

The JS and bash scripts integrate with billzorn's fork of char-rnn, mtg-rnn, in the backend
https://github.com/billzorn/mtg-rnn  
# HOW TO SETUP
I'll be running all of this in a Windows environment using Windows Subsystem for Linux.

## Setting up the Environment
1. Get the Linux distro of your choice. I recommend Ubuntu for this as I know 100% that the installs all work in it. I'll be using Ubuntu 22.04 for this guide  
![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/8a199676-20a7-4a88-92ca-c8c99b3b5327)
2. Launch Ubuntu and wait a while for it to setup. It'll ask you to create a username and password. This can be anything you want.
![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/b8f44b5e-353f-40c6-a4d1-dca35887de08)
3. You should now be logged in now
![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/82f3895f-d8e9-4e33-b3ff-8884e17ae73f)  
4. Setup **Torch** by running these commands  
   1. `git clone https://github.com/CocoaMix86/cocoa-mtgnn-torch.git ~/torch --recursive`
   2. `cd ~/torch; bash install-deps;` - this will install quite a few packages and take a few minutes.
   3. `./install.sh` - this will also take a few minutes
