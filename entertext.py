import pywinauto
import sys

arguments = sys.argv

commandused = arguments[1]
playerinvited = arguments[2]

newcommand = commandused.replace("-",'{SPACE}')
newcomment = playerinvited.replace("-",'{SPACE}')

app = pywinauto.application.Application().connect(title="Ashen Empires")
form = app.window(title_re="Ashen Empires")
form.type_keys('{ENTER} {/}' + newcommand + ' {SPACE} '+ newcomment + '{ENTER}',pause=0.055)
