import pyautogui

pyautogui.FAILSAFE = False

def move_mouse(dx: int, dy: int):
    pyautogui.moveRel(dx, dy, duration=0)

def click_mouse(button: str = 'left'):
    pyautogui.click(button=button)