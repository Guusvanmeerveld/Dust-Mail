use directories::ProjectDirs;

use std::{
    fs::{self, File},
    io::Read,
    path::PathBuf,
};

use crate::types::{Error, ErrorKind, Result};

fn parse_io_error(error: std::io::Error) -> Error {
    Error::new(ErrorKind::IoError, error.to_string())
}

const APP_NAME: &str = "Dust-Mail";

fn ensure_cache_dir(file_name: &str) -> Result<PathBuf> {
    if let Some(project_dirs) =
        ProjectDirs::from("dev.guusvanmeerveld", "Guus van Meerveld", APP_NAME)
    {
        let cache_dir = project_dirs.cache_dir().join(APP_NAME.to_ascii_lowercase());

        if let Some(p) = cache_dir.parent() {
            fs::create_dir_all(p).map_err(parse_io_error)?
        };

        return Ok(cache_dir.with_file_name(file_name));
    };

    Err(Error::new(
        ErrorKind::NoCacheDir,
        "Could locate a valid cache directory",
    ))
}

pub struct CacheFile(String);

impl CacheFile {
    pub fn from_session_name<S: Into<String>>(session_name: S) -> Self {
        Self(format!("{}.session", session_name.into()))
    }

    pub fn new<S: Into<String>>(file_name: S) -> Self {
        Self(file_name.into())
    }

    /// Read a file with a given filename from the application's cache directory.
    pub fn read(&self, buf: &mut Vec<u8>) -> Result<()> {
        let cache_file = ensure_cache_dir(&self.0)?;

        let mut file = File::open(cache_file).map_err(parse_io_error)?;

        file.read_to_end(buf).map_err(parse_io_error)?;

        Ok(())
    }

    pub fn delete(&self) -> Result<()> {
        let cache_file = ensure_cache_dir(&self.0)?;

        fs::remove_file(cache_file).map_err(parse_io_error)
    }

    /// Write a file with a given filename to the applications cache directory.
    pub fn write(&self, data: &[u8]) -> Result<()> {
        let cache_file = ensure_cache_dir(&self.0)?;

        fs::write(cache_file, data).map_err(parse_io_error)?;

        Ok(())
    }
}
