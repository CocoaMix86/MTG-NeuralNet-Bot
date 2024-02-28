# MTG-NeuralNet-Bot
A Discord bot for creating MTG cards by use of a neural network. This git is the Discord bot itself. The backend neuralnet is described below.  
The neuralnet runs thanks to work of Billzorn: [https://github.com/billzorn/mtg-rnn]  

I have forked billzorn's projects and Torch and updated files as needed so they work for modern day. Links to them all here:  
[https://github.com/CocoaMix86/cocoa-mtgnn-rnn]  
[https://github.com/CocoaMix86/cocoa-mtgnn-encode]  
[https://github.com/CocoaMix86/cocoa-mtgnn-models]  
[https://github.com/CocoaMix86/cocoa-mtgnn-torch]

# HOW TO SETUP
I'll be running all of this in a Windows environment using Windows Subsystem for Linux. You can do it entirely in Linux (without Windows) if you want.

## Setting up the neuralnet environment
1. Get the Linux distro of your choice. I recommend Ubuntu for this as I know 100% that the installs all work in it. I'll be using Ubuntu 22.04 for this guide  
![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/8a199676-20a7-4a88-92ca-c8c99b3b5327)
2. Launch Ubuntu and wait a while for it to setup. It'll ask you to create a username and password. This can be anything you want.
![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/b8f44b5e-353f-40c6-a4d1-dca35887de08)
3. You should now be logged in now
![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/82f3895f-d8e9-4e33-b3ff-8884e17ae73f)  
4. Setup **Torch** by running these commands
   1. `git config --global url."https://".insteadOf git://`  
      1. this command reconfigures luarocks to use https:// instead of git://, since the git port has been restricted in recent times.  
   2. `git clone https://github.com/CocoaMix86/cocoa-mtgnn-torch.git ~/torch --recursive`  
   3. `cd ~/torch; bash install-deps;` - this will install quite a few packages and take a few minutes.  
   4. `./install.sh` - this will also take a few minutes  
   5.  `source ~/.bashrc`  
6. Now we need to install a couple extra luarocks packages for Torch to use.  
   3. `luarocks install nngraph`  
   4. `luarocks install optim`  
   5. `luarocks install nn`  
7. If you'd like to train on an GPU (this can be to about 15x faster), you will have to install the CUDA Toolkit or packages for ATI. Use the appropriate step below.  
   1. For Nvidia GPU using CUDA  
      1. [Follow these steps](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/blob/main/readme-NviduaCUDA)
   2. For OpenCL GPU instead (e.g. ATI cards)  
      1. `luarocks install cltorch`
      2. `luarocks install clnn`
