import contrast from 'get-contrast';
import ResizeObserver from 'resize-observer-polyfill';
import produce from 'immer';

import {
  themeType,
  themeShadeType,
  themeShadeObjectType,
  actionTypes,
} from 'types';

type titleColoursType =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'white';

const titleColours: titleColoursType[] = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'purple',
  'cyan',
  'white',
];

export const getRandomColour = (theme: themeType | undefined): string => {
  if (theme == null) {
    return '';
  }
  const randomisedColours = titleColours.sort(() => Math.random() - 0.5);
  const accessibleColour = randomisedColours.find(
    (titleColour: titleColoursType) =>
      contrast.ratio(theme[titleColour], theme.background) > 4.5
  );
  if (accessibleColour != null) {
    return theme[accessibleColour];
  }
  return theme[titleColours[0]];
};

const compare = (a: themeType, b: themeType): number => {
  if (a.name.toUpperCase() < b.name.toUpperCase()) {
    return -1;
  }
  if (a.name.toUpperCase() > b.name.toUpperCase()) {
    return 1;
  }
  // a must be equal to b
  return 0;
};

const assignColourType = (themes: themeType[]): themeType[] => {
  return themes.map((theme) => {
    theme.isDark = contrast.ratio(theme.background, '#000') < 8;
    return theme;
  });
};

export const screenSizeObserver = (
  dispatch: React.Dispatch<actionTypes>
): ResizeObserver => {
  return new ResizeObserver((entries) => {
    const {width} = entries[0].contentRect;
    if (width > 768) {
      dispatch({type: 'SIZE', isSmallScreenSize: false});
    } else if (width < 768) {
      dispatch({type: 'SIZE', isSmallScreenSize: true});
    }
  });
};

export const request = async (
  dispatch: React.Dispatch<actionTypes>
): Promise<void> => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_PUBLIC_PATH}/colour-schemes.json`
    );
    const json = await response.json();
    dispatch({
      type: 'LOAD',
      themes: assignColourType(json.sort(compare)),
    });
  } catch (err) {
    console.error(err);
  }
};

export const THEME_COLOUR: themeShadeObjectType = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  ANY: 'ANY',
};

export type stateType = {
  themes: themeType[];
  filteredThemes: themeType[];
  activeTheme: string;
  isSmallScreenSize: boolean;
  themeShade: themeShadeType;
  primaryColour: string;
  backgroundColour: string;
};

export const initialState: stateType = {
  themes: [],
  filteredThemes: [],
  activeTheme: '',
  isSmallScreenSize: window.innerWidth < 768,
  themeShade: THEME_COLOUR.DARK,
  primaryColour: '#fded02',
  backgroundColour: '#090300',
};

export const homeReducer = (
  state: stateType,
  action: actionTypes
): stateType => {
  return produce(state, (draftState: stateType) => {
    let theme;
    switch (action.type) {
      case 'LOAD':
        draftState.themes = action.themes;
        draftState.filteredThemes = action.themes.filter(
          (theme: themeType) => theme.isDark
        );
        draftState.activeTheme = draftState.filteredThemes[0].name;
        break;
      case 'SET':
        console.log(action.theme);
        draftState.activeTheme = action.theme;
        // eslint-disable-next-line no-case-declarations
        theme = state.themes.find((theme) => theme.name === action.theme);
        if (theme) {
          draftState.primaryColour = getRandomColour(theme);
          draftState.backgroundColour = theme.background;
        }
        break;
      case 'SIZE':
        draftState.isSmallScreenSize = action.isSmallScreenSize;
        break;
      case 'SHADE':
        console.log(action);
        draftState.themeShade = action.themeShade;
        if (draftState.themeShade === THEME_COLOUR.DARK) {
          draftState.filteredThemes = state.themes.filter(
            (theme) => theme.isDark
          );
        }
        if (draftState.themeShade === THEME_COLOUR.LIGHT) {
          draftState.filteredThemes = state.themes.filter(
            (theme) => !theme.isDark
          );
        }
        draftState.activeTheme = draftState.filteredThemes[0].name;
        // eslint-disable-next-line no-case-declarations
        theme = state.themes.find(
          (theme) => theme.name === draftState.filteredThemes[0].name
        );
        if (theme) {
          draftState.primaryColour = getRandomColour(theme);
          draftState.backgroundColour = theme.background;
        }
        break;
      default:
        break;
    }
  });
};