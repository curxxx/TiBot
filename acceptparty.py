
import pyautogui
import time
import win32gui
import os
import pywinauto

def acceptInvite():
        app = pywinauto.application.Application().connect(title="Ashen Empires")
        form = app.window(title_re="Ashen Empires")
        form.type_keys('{TAB}',pause=0.055)
        time.sleep(1)
        pyautogui.click('Images/AcceptPartyInvite.PNG')


acceptInvite()
