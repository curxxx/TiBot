
import pyautogui
import time
import win32gui
import os
import pywinauto

def login():

    clienthandle = win32gui.FindWindow(0, "Ashen Empires")
    
    if clienthandle == 0:

        pmlhandle = win32gui.FindWindow(0, "Pixel Mine Launcher")
        
        if pmlhandle != 0:
            os.system("TASKKILL /F /IM PixelMineLauncher.exe")
            time.sleep(2)
            login()
      
        else:
            os.startfile(r"C:\Program Files (x86)\Pixel Mine\PixelMineLauncher.exe")
            time.sleep(3)
            app = pywinauto.application.Application().connect(title="Pixel Mine Launcher")
            form = app.window(title_re="Pixel Mine Launcher")
            form.type_keys('{TAB}',pause=0.055)
            time.sleep(1)
            loginbutton = pyautogui.locateOnScreen('LoginButton.png')
            loginButtonPoint = pyautogui.center(loginbutton)
            userx = loginButtonPoint.x
            usery = loginButtonPoint.y - 50
            passx = loginButtonPoint.x
            passy = loginButtonPoint.y - 25

            pyautogui.doubleClick(userx,usery)
            pyautogui.typewrite(['backspace'])
            pyautogui.typewrite('USERNAME')
            pyautogui.doubleClick(passx,passy)
            pyautogui.typewrite(['backspace'])
            pyautogui.typewrite('PASSWORD')

            pyautogui.click(loginButtonPoint)
            time.sleep(5)

            pyautogui.click('PlayButton.png')
            time.sleep(30)

            herobtn = pyautogui.locateOnScreen('HeroesServer.png')
            heroesPoint = pyautogui.center(herobtn)
            pyautogui.click(heroesPoint)

            time.sleep(10)

            playworld = pyautogui.locateOnScreen('EnterWorld.png')
            playPoint = pyautogui.center(playworld)
            pyautogui.click(playPoint)
    else:
        os.system("TASKKILL /F /IM client.exe")
        time.sleep(2)
        login()


login()
