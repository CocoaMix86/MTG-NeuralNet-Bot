## For Linux  
Go to the **section** section.

## For Windows Subsystem for Linux  
CUDA does not work out of the box on Ubuntu's kernel 19041 ([documented here](https://github.com/microsoft/WSL/issues/5554)). This is the kernel version you get from the Windows Store. We will need to do some Windows updates to get Ubuntu kernel 20150.  

1. You will need to ensure you're on the Insider's Preview of Windows
   1. Go to windows settings > Update & Security > Windows Insider Program
      ![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/f6a86e0e-f735-41d7-ba2c-27ac32ac4b92)
   2. You may need to click a button that says "Get Started" and then proceed through the prompts.
   3. Afterwards, run any available windows updates / feature updates
      ![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/e71483f5-9aa0-494f-808d-91ed3316bc5b)


5. [Download the CUDA toolkit](https://developer.nvidia.com/cuda-downloads?target_os=Linux) that's right for your linux distro. Run the commands given on that page, then run the following luarocks commands.  
         ![image](https://github.com/CocoaMix86/MTG-NeuralNet-Bot/assets/5726733/5092a867-cb99-4ec6-b620-5bbf94233750)  
         this install will take several minutes and look like nothing is happening. Eventually a prompt will appear asking you to accept a EULA.  
      3. `luarocks install cutorch`  
      4. `luarocks install cunn`  

## 
