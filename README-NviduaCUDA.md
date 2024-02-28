# For Linux  
Go to the **Setup Nvidia CUDA** section.

# For Windows Subsystem for Linux  
We need to use WSL2. CUDA does not work out of the box on Ubuntu's kernel 19041 ([documented here](https://github.com/microsoft/WSL/issues/5554)). This is the kernel version you get from the Windows Store. We will need to do some Windows updates to get Ubuntu kernel 20150 and to use WSL2.  

### Update Windows
1. Go to windows settings > Update & Security > Windows Insider Program
   ![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/f6a86e0e-f735-41d7-ba2c-27ac32ac4b92)
2. You may need to click a button that says "Get Started" and then proceed through the prompts.
3. Afterwards, run any available windows updates / feature updates and reboot. You may need to do this a few times.
   ![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/e71483f5-9aa0-494f-808d-91ed3316bc5b)
4. Run this command to update your Ubuntu to WSL2
   `wsl --set-version Ubuntu-22.04 2`

# Setup Nvidia CUDA
1. [Download the CUDA toolkit](https://developer.nvidia.com/cuda-downloads?target_os=Linux) that's right for your linux distro. **Make sure to select WSL-Ubuntu for Windows!** Run the commands given on that page. this install will take several minutes and look like nothing is happening. Eventually a prompt will appear asking you to accept a EULA.
   ![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/5092a867-cb99-4ec6-b620-5bbf94233750)  
   ![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/ab3cc32c-531c-46b6-8484-7a31c2e8ffdc)
2. Install these luarocks packages
   1. `luarocks install cutorch`
   2. `luarocks install cunn`  
.
